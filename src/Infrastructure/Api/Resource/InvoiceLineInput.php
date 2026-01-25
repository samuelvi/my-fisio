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
    #[Assert\Range(max: 10000, maxMessage: 'invoice_line_quantity_max')]
    public int $quantity = 1;

    #[Groups(['invoice:write'])]
    #[Assert\NotNull(message: 'invoice_line_price_required')]
    #[Assert\PositiveOrZero(message: 'invoice_line_price_non_negative')]
    #[Assert\Range(max: 999999.99, maxMessage: 'invoice_line_price_max')]
    public float $price = 0.0;

    public function __construct()
    {
    }
}
