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
    public function __construct(
        private EmptySlotCreator $emptySlotCreator,
        private AppointmentRepositoryInterface $appointmentRepository,
    ) {
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
