<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Controller;

use App\Domain\Repository\PatientRepositoryInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

class InvoicePrefillController extends AbstractController
{
    public function __construct(
        private readonly PatientRepositoryInterface $patientRepository,
    ) {
    }

    #[Route('/api/invoice-prefill', name: 'invoice_prefill', methods: ['GET'], options: ['expose' => true])]
    public function __invoke(Request $request): JsonResponse
    {
        $patientId = $request->query->get('patientId');
        if (!$patientId) {
            throw new BadRequestHttpException('patientId parameter is required');
        }

        $prefillData = $this->patientRepository->findForInvoicePrefill((int) $patientId);
        if (!$prefillData) {
            throw new NotFoundHttpException('Patient not found');
        }

        // Ensure all fields have default values
        $prefillData['taxId'] ??= '';
        $prefillData['email'] ??= '';
        $prefillData['phone'] ??= '';
        $prefillData['address'] ??= '';

        return new JsonResponse($prefillData);
    }
}
