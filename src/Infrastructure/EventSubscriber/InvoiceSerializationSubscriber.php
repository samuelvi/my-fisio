<?php

declare(strict_types=1);

namespace App\Infrastructure\EventSubscriber;

use ApiPlatform\Symfony\EventListener\EventPriorities;
use App\Application\Service\InvoiceFormatter;
use App\Domain\Entity\Invoice;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ViewEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final class InvoiceSerializationSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly InvoiceFormatter $invoiceFormatter
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::VIEW => ['addFormattedNumber', EventPriorities::PRE_SERIALIZE],
        ];
    }

    public function addFormattedNumber(ViewEvent $event): void
    {
        $invoice = $event->getControllerResult();
        $method = $event->getRequest()->getMethod();

        // Only process GET requests for Invoice entities
        if ($method !== 'GET') {
            return;
        }

        // Handle single invoice
        if ($invoice instanceof Invoice) {
            $invoice->formattedNumber = $this->invoiceFormatter->formatNumber($invoice->number);
            return;
        }

        // Handle invoice collection
        if (is_array($invoice) || $invoice instanceof \Traversable) {
            foreach ($invoice as $item) {
                if ($item instanceof Invoice) {
                    $item->formattedNumber = $this->invoiceFormatter->formatNumber($item->number);
                }
            }
        }
    }
}
