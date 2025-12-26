<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Extension;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Domain\Entity\Invoice;
use Doctrine\ORM\QueryBuilder;

use function sprintf;

final class InvoiceNumberExtension implements QueryCollectionExtensionInterface
{
    public function applyToCollection(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        if (Invoice::class !== $resourceClass) {
            return;
        }

        // 'filters' key contains query parameters
        if (isset($context['filters']['number']) && '' !== $context['filters']['number']) {
            $value = $context['filters']['number'];
            $rootAlias = $queryBuilder->getRootAliases()[0];

            // Force parameter name to avoid conflicts
            $parameterName = 'invoice_number_ext';

            $queryBuilder
                ->andWhere(sprintf('%s.number LIKE :%s', $rootAlias, $parameterName))
                ->setParameter($parameterName, $value.'%');
        }
    }
}
