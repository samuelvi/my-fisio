<?php

declare(strict_types=1);

namespace App\Controller;

use App\Domain\Entity\Patient;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

class InvoicePrefillController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/api/invoice-prefill', name: 'invoice_prefill', methods: ['GET'])]
    public function __invoke(Request $request): JsonResponse
    {
        $patientId = $request->query->get('patientId');

        if (!$patientId) {
            throw new BadRequestHttpException('patientId parameter is required');
        }

        $patient = $this->entityManager->getRepository(Patient::class)->find((int) $patientId);

        if (!$patient) {
            throw new NotFoundHttpException('Patient not found');
        }

        // Map patient data to invoice customer fields
        $prefillData = [
            'fullName' => $patient->fullName,
            'taxId' => $patient->taxId ?? '',
            'email' => $patient->email ?? '',
            'phone' => $patient->phone ?? '',
            'address' => $patient->address ?? '',
        ];

        return new JsonResponse($prefillData);
    }
}
