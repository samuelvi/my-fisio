<?php

declare(strict_types=1);

namespace App\Infrastructure\Http;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final class LocaleSubscriber implements EventSubscriberInterface
{
    private const SUPPORTED_LOCALES = ['en', 'es'];

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 20],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $headerLocale = $request->headers->get('X-App-Locale')
            ?? $this->extractPreferredLocale($request->headers->get('Accept-Language', ''));

        if (!$headerLocale) {
            return;
        }

        $locale = strtolower(substr($headerLocale, 0, 2));
        if (!in_array($locale, self::SUPPORTED_LOCALES, true)) {
            return;
        }

        $request->setLocale($locale);
    }

    private function extractPreferredLocale(string $acceptLanguage): ?string
    {
        if ($acceptLanguage === '') {
            return null;
        }

        $first = explode(',', $acceptLanguage)[0] ?? '';
        $first = trim(explode(';', $first)[0] ?? '');

        return $first !== '' ? $first : null;
    }
}
