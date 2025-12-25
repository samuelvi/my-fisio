<?php

declare(strict_types=1);

namespace App\Application\Query\Dashboard\GetDashboardStats;

use App\Application\Dto\Dashboard\DashboardStatsView;
use App\Domain\Enum\AppointmentType;
use App\Domain\Repository\AppointmentRepositoryInterface;
use App\Domain\Repository\InvoiceRepositoryInterface;
use App\Domain\Repository\PatientRepositoryInterface;
use DateTimeImmutable;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetDashboardStatsHandler
{
    public function __construct(
        private PatientRepositoryInterface $patientRepository,
        private AppointmentRepositoryInterface $appointmentRepository,
        private InvoiceRepositoryInterface $invoiceRepository
    ) {}

    public function __invoke(GetDashboardStatsQuery $query): DashboardStatsView
    {
        $today = new DateTimeImmutable();
        $currentYear = (int) $today->format('Y');

        return DashboardStatsView::create(
            totalPatients: $this->patientRepository->countAll(),
            appointmentsToday: $this->appointmentRepository->countByDateAndType($today, AppointmentType::APPOINTMENT),
            othersToday: $this->appointmentRepository->countByDateAndType($today, AppointmentType::OTHER),
            invoicesThisYear: $this->invoiceRepository->countByYear($currentYear)
        );
    }
}
