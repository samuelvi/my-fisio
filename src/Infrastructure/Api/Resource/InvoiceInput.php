<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Resource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use DateTimeImmutable;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(operations: [])]
final class InvoiceInput
{
    #[Groups(['invoice:write'])]
    public ?DateTimeImmutable $date = null;

    #[Groups(['invoice:write'])]
    public ?string $fullName = null;

    #[Groups(['invoice:write'])]
    public ?string $number = null;

    #[Groups(['invoice:write'])]
    public ?string $phone = null;

    #[Groups(['invoice:write'])]
    #[Assert\NotBlank(message: 'invoice_address_required')]
    public ?string $address = null;

    #[Groups(['invoice:write'])]
    public ?string $email = null;

    #[Groups(['invoice:write'])]
    public ?string $taxId = null;

    /**
     * @var array<int, array<string, mixed>|InvoiceLineInput>
     */
    #[ApiProperty]
    #[Groups(['invoice:write'])]
    #[Assert\Count(min: 1, minMessage: 'invoice_lines_min')]
    #[Assert\Valid]
    public array $lines = [];

    public function __construct()
    {
    }
}
