<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'counters')]
class Counter
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['counter:read'])]
    public ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 50, unique: true, nullable: false)]
    #[Groups(['counter:read', 'counter:write'])]
    public string $name;

    #[ORM\Column(type: Types::TEXT, nullable: false)]
    #[Groups(['counter:read', 'counter:write'])]
    public string $value;

    private function __construct(string $name, string $value)
    {
        $this->name = $name;
        $this->value = $value;
    }

    public static function create(string $name, string $value): self
    {
        return new self($name, $value);
    }
}
