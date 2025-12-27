<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Extension;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Domain\Entity\Invoice;
use App\Infrastructure\Util\TextNormalizer;
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

            // Use LOWER() for case-insensitive search
            // Changed to '%value%' to match anywhere in the number, not just the beginning
            $queryBuilder
                ->andWhere(sprintf('LOWER(%s.number) LIKE LOWER(:%s)', $rootAlias, $parameterName))
                ->setParameter($parameterName, '%'.$value.'%');
        }

        // Add case-insensitive and accent-insensitive search for customer name (fullName field)
        if (isset($context['filters']['name']) && '' !== $context['filters']['name']) {
            $value = $context['filters']['name'];
            $rootAlias = $queryBuilder->getRootAliases()[0];
            $parameterName = 'invoice_name_ext';

            // Use normalized column for fast search (no functions on left side)
            $normalizedValue = TextNormalizer::normalize($value);
            $queryBuilder
                ->andWhere(sprintf('%s.fullNameNormalized LIKE :%s', $rootAlias, $parameterName))
                ->setParameter($parameterName, '%'.$normalizedValue.'%');
        }
    }
}
