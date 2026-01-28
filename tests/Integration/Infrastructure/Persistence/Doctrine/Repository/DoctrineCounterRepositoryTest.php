<?php

declare(strict_types=1);

namespace App\Tests\Integration\Infrastructure\Persistence\Doctrine\Repository;

use App\Domain\Entity\Counter;
use App\Infrastructure\Persistence\Doctrine\Repository\DoctrineCounterRepository;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Zenstruck\Foundry\Test\Factories;
use Zenstruck\Foundry\Test\ResetDatabase;

class DoctrineCounterRepositoryTest extends KernelTestCase
{
    use ResetDatabase;
    use Factories;

    private DoctrineCounterRepository $repository;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->repository = self::getContainer()->get(DoctrineCounterRepository::class);
    }

    public function testIncrementAndGetNextCreatesCounterIfMissing(): void
    {
        $next = $this->repository->incrementAndGetNext('invoice_2025', '2025000001');

        $this->assertSame('2025000001', $next);
    }

    public function testIncrementAndGetNextIncrementsExistingCounter(): void
    {
        // 1. Create initial
        $this->repository->incrementAndGetNext('invoice_2025', '2025000001');

        // 2. Increment
        $next = $this->repository->incrementAndGetNext('invoice_2025', '2025000001');

        $this->assertSame('2025000002', $next);
    }

    public function testSeparateKeysAreIndependent(): void
    {
        $this->repository->incrementAndGetNext('invoice_2025', '2025000001');
        $this->repository->incrementAndGetNext('invoice_2026', '2026000001');

        $next2025 = $this->repository->incrementAndGetNext('invoice_2025', '2025000001');
        $next2026 = $this->repository->incrementAndGetNext('invoice_2026', '2026000001');

        $this->assertSame('2025000002', $next2025);
        $this->assertSame('2026000002', $next2026);
    }
}
