<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class DefaultController extends AbstractController
{
    #[Route('/{reactRouting}', name: 'app_home', requirements: ['reactRouting' => '^(?!api).+'], defaults: ['reactRouting' => null], priority: -1)]
    public function index(): Response
    {
        return $this->render('default/index.html.twig');
    }
}