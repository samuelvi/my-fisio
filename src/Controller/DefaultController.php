<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Translation\TranslatorBagInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

class DefaultController extends AbstractController
{
    #[Route('/{reactRouting}', name: 'app_home', requirements: ['reactRouting' => '^(?!api).+'], defaults: ['reactRouting' => null], priority: -1)]
    public function index(TranslatorInterface $translator): Response
    {
        $locales = ['en', 'es'];
        $catalog = [];

        foreach ($locales as $locale) {
            if ($translator instanceof TranslatorBagInterface) {
                $catalogue = $translator->getCatalogue($locale);
                $catalog[$locale] = $catalogue->all('messages');
            } else {
                $catalog[$locale] = [];
            }

            // Override app_name with env variable if present
            $appTitle = $_ENV['VITE_APP_TITLE'] ?? $_SERVER['VITE_APP_TITLE'] ?? 'PhysioApp';
            $catalog[$locale]['app_name'] = $appTitle;
        }

        return $this->render('default/index.html.twig', [
            'translations' => $catalog,
        ]);
    }
}
