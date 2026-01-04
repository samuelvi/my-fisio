<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Doctrine\Repository;

use App\Application\Dto\Invoice\InvoiceExportView;
use App\Application\Dto\Invoice\InvoiceLineView;
use App\Domain\Entity\Invoice;
use App\Domain\Repository\InvoiceRepositoryInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

use function sprintf;

/**
 * @extends ServiceEntityRepository<Invoice>
 */
final class DoctrineInvoiceRepository extends ServiceEntityRepository implements InvoiceRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Invoice::class);
    }

    public function get(int $id): \App\Domain\Entity\Invoice
    {
        /** @var \App\Domain\Entity\Invoice|null $invoice */
        $invoice = $this->createQueryBuilder('i')
            ->select('i', 'l')
            ->leftJoin('i.lines', 'l')
            ->where('i.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();

        if (!$invoice) {
            throw new \RuntimeException(sprintf('Invoice with id %d not found', $id));
        }

        return $invoice;
    }

    public function save(Invoice $invoice): void
    {
        $this->getEntityManager()->persist($invoice);
        $this->getEntityManager()->flush();
    }

    public function removeLine(\App\Domain\Entity\InvoiceLine $line): void
    {
        $this->getEntityManager()->remove($line);
    }

    #[\Override]
    public function findLatestNumberForYear(int $year): ?string
    {
        $prefix = sprintf('%d', $year);

        $qb = $this->createQueryBuilder('i')
            ->select('i.number')
            ->where('i.number LIKE :prefix')
            ->orderBy('i.number', 'DESC')
            ->setMaxResults(1)
            ->setParameter('prefix', $prefix.'%');

        $result = $qb->getQuery()->getArrayResult();

        return $result[0]['number'] ?? null;
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
                amount: (float) $lineData['amount'],
            );
        }, $data['lines']);

        return InvoiceExportView::create(
            id: $data['id'],
            number: $data['number'],
            date: $data['date'],
            amount: (float) $data['amount'],
            fullName: $data['fullName'],
            taxId: $data['taxId'],
            address: $data['address'],
            phone: $data['phone'],
            email: $data['email'],
            lines: $lines,
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

    public function getNumbersByYear(int $year): array
    {
        $prefix = sprintf('%d', $year);
        $qb = $this->createQueryBuilder('i')
            ->select('i.number')
            ->where('i.number LIKE :prefix')
            ->orderBy('i.number', 'ASC')
            ->setParameter('prefix', $prefix.'%');

        $result = $qb->getQuery()->getArrayResult();

        return array_values(array_filter(array_map(
            static fn (array $row) => $row['number'] ?? null,
            $result,
        )));
    }

    public function getNumbersByYearExcluding(int $year, int $excludeId): array
    {
        $prefix = sprintf('%d', $year);
        $qb = $this->createQueryBuilder('i')
            ->select('i.number')
            ->where('i.number LIKE :prefix')
            ->andWhere('i.id != :excludeId')
            ->orderBy('i.number', 'ASC')
            ->setParameter('prefix', $prefix.'%')
            ->setParameter('excludeId', $excludeId);

        $result = $qb->getQuery()->getArrayResult();

        return array_values(array_filter(array_map(
            static fn (array $row) => $row['number'] ?? null,
            $result,
        )));
    }
}
