<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Resource;

use ApiPlatform\Metadata\ApiResource;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(operations: [])]
final class InvoiceLineInput
{
    #[Groups(['invoice:write'])]
    #[Assert\NotBlank(message: 'invoice_line_concept_required')]
    public ?string $concept = null;

    #[Groups(['invoice:write'])]
    public ?string $description = null;

    #[Groups(['invoice:write'])]
    #[Assert\Positive(message: 'invoice_line_quantity_positive')]
    public int $quantity = 1;

    #[Groups(['invoice:write'])]
    #[Assert\Positive(message: 'invoice_line_price_non_negative')]
    public float $price = 0.0;

    public function __construct()
    {
    }
}
