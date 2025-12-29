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
                ->setParameter($parameterName, '%'.$value.'%');
        }

        // Add case-insensitive search for customer name (fullName field)
        // MariaDB with utf8mb4_unicode_ci collation handles accent-insensitive comparisons automatically
        $nameFilter = null;
        if (isset($context['filters']['fullName']) && '' !== $context['filters']['fullName']) {
            $nameFilter = $context['filters']['fullName'];
        } elseif (isset($context['filters']['name']) && '' !== $context['filters']['name']) {
            $nameFilter = $context['filters']['name'];
        }

        if (null !== $nameFilter) {
            $value = $nameFilter;
            $rootAlias = $queryBuilder->getRootAliases()[0];
            $parameterName = 'invoice_name_ext';

            $queryBuilder
                ->andWhere(sprintf('%s.fullName LIKE :%s', $rootAlias, $parameterName))
                ->setParameter($parameterName, '%'.$value.'%');
        }

        if (isset($context['filters']['taxId']) && '' !== $context['filters']['taxId']) {
            $value = $context['filters']['taxId'];
            $rootAlias = $queryBuilder->getRootAliases()[0];
            $parameterName = 'invoice_tax_id_ext';

            $queryBuilder
                ->andWhere(sprintf('%s.taxId LIKE :%s', $rootAlias, $parameterName))
                ->setParameter($parameterName, '%'.$value.'%');
        }
    }
}
