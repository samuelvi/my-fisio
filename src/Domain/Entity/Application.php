<?php

declare(strict_types=1);

namespace App\Domain\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use InvalidArgumentException;

#[ORM\Entity]
#[ORM\Table(name: 'applications')]
class Application
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: Types::INTEGER)]
    public ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 255, nullable: false)]
    public string $name;

    private function __construct(string $name)
    {
        if ('' === $name) {
            throw new InvalidArgumentException('Application name cannot be empty');
        }
        $this->name = $name;
    }

    public static function create(string $name): self
    {
        return new self($name);
    }
}
