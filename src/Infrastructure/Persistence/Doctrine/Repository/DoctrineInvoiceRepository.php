<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Repository;

use App\Application\Dto\Invoice\InvoiceExportView;
use App\Application\Dto\Invoice\InvoiceLineView;
use App\Domain\Entity\Invoice;
use App\Domain\Repository\InvoiceRepositoryInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Invoice>
 */
final class DoctrineInvoiceRepository extends ServiceEntityRepository implements InvoiceRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Invoice::class);
    }

    public function getInvoiceExportView(int $id): ?InvoiceExportView
    {
        $qb = $this->createQueryBuilder('i')
            ->select('i', 'l')
            ->leftJoin('i.lines', 'l')
            ->where('i.id = :id')
            ->setParameter('id', $id);

        $result = $qb->getQuery()->getArrayResult();

        if (empty($result)) {
            return null;
        }

        $data = $result[0];

        $lines = array_map(function (array $lineData) {
            return InvoiceLineView::create(
                id: $lineData['id'],
                concept: $lineData['concept'],
                description: $lineData['description'],
                quantity: $lineData['quantity'],
                price: (float) $lineData['price'],
                amount: (float) $lineData['amount']
            );
        }, $data['lines']);

        return InvoiceExportView::create(
            id: $data['id'],
            number: $data['number'],
            date: $data['date'],
            amount: (float) $data['amount'],
            name: $data['name'],
            taxId: $data['taxId'],
            address: $data['address'],
            phone: $data['phone'],
            email: $data['email'],
            lines: $lines
        );
    }

    public function countByYear(int $year): int
    {
        $start = sprintf('%d-01-01 00:00:00', $year);
        $end = sprintf('%d-12-31 23:59:59', $year);

        $qb = $this->createQueryBuilder('i')
            ->select('COUNT(i.id) as total')
            ->where('i.date >= :start')
            ->andWhere('i.date <= :end')
            ->setParameter('start', $start)
            ->setParameter('end', $end);

        $result = $qb->getQuery()->getArrayResult();

        return (int) ($result[0]['total'] ?? 0);
    }
}