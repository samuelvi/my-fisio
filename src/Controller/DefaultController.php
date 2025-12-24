<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\Translation\TranslatorInterface;

class DefaultController extends AbstractController
{
    #[Route('/{reactRouting}', name: 'app_home', requirements: ['reactRouting' => '^(?!api).+'], defaults: ['reactRouting' => null], priority: -1)]
    public function index(TranslatorInterface $translator): Response
    {
        $locales = ['en', 'es'];
        $keys = [
            'app_name', 'dashboard', 'patients', 'appointments', 'invoices', 'logout',
            'new_patient', 'new_appointment', 'new_invoice', 'save', 'cancel', 'delete',
            'update', 'create', 'search', 'clear', 'edit', 'view', 'status', 'actions',
            'confirm', 'discard', 'loading', 'patient_file', 'clinical_history',
            'personal_information', 'contact_details', 'clinical_background', 'danger_zone',
            'language', 'english', 'spanish', 'sign_in_to_account', 'email_address',
            'password', 'sign_in', 'invalid_credentials', 'session_expired_msg',
            'clinic_management', 'administrator', 'search_placeholder', 'intelligent_search',
            'sort_by', 'latest_added', 'alphabetical', 'active', 'inactive', 'previous',
            'next', 'back_to_start', 'page', 'no_patients_found', 'loading_patients'
        ];

        $appTitle = $_ENV['VITE_APP_TITLE'] ?? $_SERVER['VITE_APP_TITLE'] ?? 'PhysioApp';

        $catalog = [];
        foreach ($locales as $locale) {
            foreach ($keys as $key) {
                $catalog[$locale][$key] = ($key === 'app_name') ? $appTitle : $translator->trans($key, [], 'messages', $locale);
            }
        }

        return $this->render('default/index.html.twig', [
            'translations' => $catalog
        ]);
    }
}
