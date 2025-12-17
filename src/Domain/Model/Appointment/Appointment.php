<?php

declare(strict_types=1);

namespace App\Domain\Model\Appointment;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'appointments')]
class Appointment
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'integer', nullable: false)]
    private int $userId;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $title = null;

    #[ORM\Column(type: 'boolean', nullable: true)]
    private ?bool $allDay = null;

    #[ORM\Column(type: 'datetime', nullable: false)]
    private \DateTimeInterface $startsAt;

    #[ORM\Column(type: 'datetime', nullable: false)]
    private \DateTimeInterface $endsAt;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $url = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $className = null;

    #[ORM\Column(type: 'boolean', nullable: true)]
    private ?bool $editable = null;

    #[ORM\Column(type: 'boolean', nullable: true)]
    private ?bool $startEditable = null;

    #[ORM\Column(type: 'boolean', nullable: true)]
    private ?bool $durationEditable = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $rendering = null;

    #[ORM\Column(type: 'boolean', nullable: true)]
    private ?bool $overlap = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $constraintId = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $source = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $color = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $backgroundColor = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $textColor = null;

    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $customFields = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $notes = null;

    #[ORM\Column(type: 'datetime', nullable: false)]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct(
        int $userId,
        \DateTimeInterface $startsAt,
        \DateTimeInterface $endsAt
    ) {
        $this->userId = $userId;
        $this->startsAt = $startsAt;
        $this->endsAt = $endsAt;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function setUserId(int $userId): self
    {
        $this->userId = $userId;
        return $this;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(?string $title): self
    {
        $this->title = $title;
        return $this;
    }

    public function isAllDay(): ?bool
    {
        return $this->allDay;
    }

    public function setAllDay(?bool $allDay): self
    {
        $this->allDay = $allDay;
        return $this;
    }

    public function getStartsAt(): \DateTimeInterface
    {
        return $this->startsAt;
    }

    public function setStartsAt(\DateTimeInterface $startsAt): self
    {
        $this->startsAt = $startsAt;
        return $this;
    }

    public function getEndsAt(): \DateTimeInterface
    {
        return $this->endsAt;
    }

    public function setEndsAt(\DateTimeInterface $endsAt): self
    {
        $this->endsAt = $endsAt;
        return $this;
    }

    public function getUrl(): ?string
    {
        return $this->url;
    }

    public function setUrl(?string $url): self
    {
        $this->url = $url;
        return $this;
    }

    public function getClassName(): ?string
    {
        return $this->className;
    }

    public function setClassName(?string $className): self
    {
        $this->className = $className;
        return $this;
    }

    public function isEditable(): ?bool
    {
        return $this->editable;
    }

    public function setEditable(?bool $editable): self
    {
        $this->editable = $editable;
        return $this;
    }

    public function isStartEditable(): ?bool
    {
        return $this->startEditable;
    }

    public function setStartEditable(?bool $startEditable): self
    {
        $this->startEditable = $startEditable;
        return $this;
    }

    public function isDurationEditable(): ?bool
    {
        return $this->durationEditable;
    }

    public function setDurationEditable(?bool $durationEditable): self
    {
        $this->durationEditable = $durationEditable;
        return $this;
    }

    public function getRendering(): ?string
    {
        return $this->rendering;
    }

    public function setRendering(?string $rendering): self
    {
        $this->rendering = $rendering;
        return $this;
    }

    public function hasOverlap(): ?bool
    {
        return $this->overlap;
    }

    public function setOverlap(?bool $overlap): self
    {
        $this->overlap = $overlap;
        return $this;
    }

    public function getConstraintId(): ?int
    {
        return $this->constraintId;
    }

    public function setConstraintId(?int $constraintId): self
    {
        $this->constraintId = $constraintId;
        return $this;
    }

    public function getSource(): ?string
    {
        return $this->source;
    }

    public function setSource(?string $source): self
    {
        $this->source = $source;
        return $this;
    }

    public function getColor(): ?string
    {
        return $this->color;
    }

    public function setColor(?string $color): self
    {
        $this->color = $color;
        return $this;
    }

    public function getBackgroundColor(): ?string
    {
        return $this->backgroundColor;
    }

    public function setBackgroundColor(?string $backgroundColor): self
    {
        $this->backgroundColor = $backgroundColor;
        return $this;
    }

    public function getTextColor(): ?string
    {
        return $this->textColor;
    }

    public function setTextColor(?string $textColor): self
    {
        $this->textColor = $textColor;
        return $this;
    }

    public function getCustomFields(): ?array
    {
        return $this->customFields;
    }

    public function setCustomFields(?array $customFields): self
    {
        $this->customFields = $customFields;
        return $this;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): self
    {
        $this->notes = $notes;
        return $this;
    }

    public function getCreatedAt(): \DateTimeInterface
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeInterface $updatedAt): self
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    #[ORM\PreUpdate]
    public function updateTimestamp(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }
}
