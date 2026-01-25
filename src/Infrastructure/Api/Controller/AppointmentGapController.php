<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Controller;

use App\Application\Service\EmptySlotCreator;
use App\Domain\Entity\User;
use App\Domain\Repository\AppointmentRepositoryInterface;
use DateTimeImmutable;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/appointment-gaps', name: 'api_appointment_gaps_', options: ['expose' => true])]
class AppointmentGapController extends AbstractController
{
    private const MAX_RANGE_DAYS = 31;

    public function __construct(
        private EmptySlotCreator $emptySlotCreator,
        private AppointmentRepositoryInterface $appointmentRepository,
    ) {
    }

    private function validateDateRange(DateTimeImmutable $start, DateTimeImmutable $end): ?JsonResponse
    {
        if ($start >= $end) {
            return $this->json(
                ['error' => 'Start date must be before end date'],
                Response::HTTP_BAD_REQUEST
            );
        }

        $diffDays = $start->diff($end)->days;
        if ($diffDays > self::MAX_RANGE_DAYS) {
            return $this->json(
                ['error' => sprintf('Date range cannot exceed %d days (1 month)', self::MAX_RANGE_DAYS)],
                Response::HTTP_BAD_REQUEST
            );
        }

        return null;
    }

    /**
     * Generate empty appointment gaps for a date range.
     */
    #[Route('/generate', name: 'generate', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function generateGaps(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['start']) || !isset($data['end'])) {
            return $this->json(
                ['error' => 'Missing required parameters: start and end'],
                Response::HTTP_BAD_REQUEST
            );
        }

        /** @var User $user */
        $user = $this->getUser();

        try {
            $start = new DateTimeImmutable($data['start']);
            $end = new DateTimeImmutable($data['end']);

            if ($validationError = $this->validateDateRange($start, $end)) {
                return $validationError;
            }

            // Check if there are already appointments in this date range
            if ($this->appointmentRepository->existsAppointmentsInDateRange($start, $end)) {
                return $this->json(
                    ['error' => 'Cannot generate gaps: appointments already exist in this date range'],
                    Response::HTTP_CONFLICT
                );
            }

            // Generate empty gaps
            $slotsGenerated = $this->emptySlotCreator->createEmptySlotsIfNeeded($start, $end, $user->id);

            if ($slotsGenerated === 0) {
                return $this->json(
                    ['warning' => 'No working hours configured for the selected date range (e.g., weekends)'],
                    Response::HTTP_OK
                );
            }

            return $this->json(
                ['message' => 'Empty gaps generated successfully', 'count' => $slotsGenerated],
                Response::HTTP_CREATED
            );
        } catch (\Exception $e) {
            return $this->json(
                ['error' => 'Failed to generate gaps: ' . $e->getMessage()],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Delete all empty appointment gaps (type = null) for a date range.
     */
    #[Route('/delete-empty', name: 'delete_empty', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function deleteEmptyGaps(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['start']) || !isset($data['end'])) {
            return $this->json(
                ['error' => 'Missing required parameters: start and end'],
                Response::HTTP_BAD_REQUEST
            );
        }

        try {
            $start = new DateTimeImmutable($data['start']);
            $end = new DateTimeImmutable($data['end']);

            if ($validationError = $this->validateDateRange($start, $end)) {
                return $validationError;
            }

            // Delete empty gaps (where type is null)
            $deletedCount = $this->appointmentRepository->deleteEmptyGapsInDateRange($start, $end);

            return $this->json(
                [
                    'message' => 'Empty gaps deleted successfully',
                    'deletedCount' => $deletedCount,
                ],
                Response::HTTP_OK
            );
        } catch (\Exception $e) {
            return $this->json(
                ['error' => 'Failed to delete empty gaps: ' . $e->getMessage()],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }
}
