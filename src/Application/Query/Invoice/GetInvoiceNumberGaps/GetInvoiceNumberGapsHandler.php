<?php

declare(strict_types=1);

namespace App\Application\Query\Invoice\GetInvoiceNumberGaps;

use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use App\Application\Dto\Invoice\InvoiceNumberGapsView;
use App\Domain\Repository\InvoiceRepositoryInterface;

#[AsMessageHandler]
final readonly class GetInvoiceNumberGapsHandler
{
    public function __construct(
        private InvoiceRepositoryInterface $invoiceRepository
    ) {}

    public function __invoke(GetInvoiceNumberGapsQuery $query): InvoiceNumberGapsView
    {
        $numbers = $this->invoiceRepository->getNumbersByYear($query->year);
        $sequences = $this->extractSequences($numbers, $query->year);

        if (empty($sequences)) {
            return InvoiceNumberGapsView::create($query->year, 0, 0, []);
        }

        sort($sequences);
        $maxSequence = max($sequences);
        $sequenceSet = array_fill_keys($sequences, true);

        $missing = [];
        for ($i = 1; $i <= $maxSequence; $i++) {
            if (!isset($sequenceSet[$i])) {
                $missing[] = $i;
            }
        }

        $gaps = array_map(
            fn (int $sequence) => $this->formatNumber($query->year, $sequence),
            $missing
        );

        return InvoiceNumberGapsView::create(
            year: $query->year,
            totalInvoices: count(array_unique($sequences)),
            totalGaps: count($missing),
            gaps: $gaps
        );
    }

    /**
     * @param array<int, string> $numbers
     * @return array<int, int>
     */
    private function extractSequences(array $numbers, int $year): array
    {
        $sequences = [];
        foreach ($numbers as $number) {
            $number = trim($number);
            if ($number === '') {
                continue;
            }
            if (strlen($number) >= 6) {
                $sequence = (int) substr($number, 4);
                if ($sequence > 0) {
                    $sequences[] = $sequence;
                    continue;
                }
            }
            $fallback = (int) $number;
            if ($fallback > 0) {
                $sequences[] = $fallback;
            }
        }

        return $sequences;
    }

    private function formatNumber(int $year, int $sequence): string
    {
        return sprintf('%d%06d', $year, $sequence);
    }
}
