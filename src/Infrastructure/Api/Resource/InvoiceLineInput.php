<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Resource;

use ApiPlatform\Metadata\ApiResource;
use Symfony\Component\Serializer\Attribute\Groups;

#[ApiResource(operations: [])]
final class InvoiceLineInput
{
    #[Groups(['invoice:write'])]
    public ?string $concept = null;

    #[Groups(['invoice:write'])]
    public ?string $description = null;

    #[Groups(['invoice:write'])]
    public int $quantity = 1;

    #[Groups(['invoice:write'])]
    public float $price = 0.0;

    public function __construct()
    {
    }
}
