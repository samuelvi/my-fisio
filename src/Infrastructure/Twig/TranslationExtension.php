<?php

declare(strict_types=1);

namespace App\Infrastructure\Twig;

use Symfony\Component\Translation\TranslatorBagInterface;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Contracts\Translation\TranslatorInterface;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class TranslationExtension extends AbstractExtension
{
    public function __construct(
        private readonly TranslatorInterface $translator,
        private readonly CacheInterface $cache
    ) {
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('get_app_translations', [$this, 'getAppTranslations']),
        ];
    }

    public function getAppTranslations(): array
    {
        return $this->cache->get('app_translations_catalog', function (ItemInterface $item) {
            $item->expiresAfter(3600); // Cache for 1 hour

            $locales = ['en', 'es'];
            $catalog = [];

            foreach ($locales as $locale) {
                if ($this->translator instanceof TranslatorBagInterface) {
                    $catalogue = $this->translator->getCatalogue($locale);
                    $catalog[$locale] = $catalogue->all('messages');
                } else {
                    $catalog[$locale] = [];
                }

                // Append app_name from env
                $appTitle = $_ENV['VITE_APP_TITLE'] ?? $_SERVER['VITE_APP_TITLE'] ?? 'PhysioApp';
                $catalog[$locale]['app_name'] = $appTitle;
            }

            return $catalog;
        });
    }
}
