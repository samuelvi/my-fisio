<?php

declare(strict_types=1);

namespace App\Infrastructure\Api\Controller;

use App\Application\Query\Invoice\GetInvoiceExport\GetInvoiceExportQuery;
use Dompdf\Dompdf;
use Dompdf\Options;

use function in_array;
use function sprintf;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Messenger\HandleTrait;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Contracts\Translation\TranslatorInterface;

class InvoiceExportController extends AbstractController
{
    use HandleTrait;

    public function __construct(
        private MessageBusInterface $queryBus,
    ) {
        $this->messageBus = $this->queryBus;
    }

    #[Route('/api/invoices/{id}/export/{format}', name: 'invoice_export', requirements: ['format' => 'pdf|html'], methods: ['GET'], options: ['expose' => true])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function __invoke(
        int $id,
        string $format,
        Request $request,
        TranslatorInterface $translator,
        #[Autowire('%kernel.project_dir%')]
        string $projectDir,
        #[Autowire('%company_name%')]
        string $companyName,
        #[Autowire('%company_tax_id%')]
        string $companyTaxId,
        #[Autowire('%company_address_line1%')]
        string $companyAddressLine1,
        #[Autowire('%company_address_line2%')]
        string $companyAddressLine2,
        #[Autowire('%company_phone%')]
        string $companyPhone,
        #[Autowire('%company_email%')]
        string $companyEmail,
        #[Autowire('%company_web%')]
        string $companyWeb,
        #[Autowire('%company_logo_path%')]
        string $companyLogoPath,
        #[Autowire('%invoice_prefix%')]
        string $invoicePrefix,
    ): Response {
        // CQRS: Query for the View DTO
        $invoice = $this->handle(GetInvoiceExportQuery::create(id: $id));

        if (!$invoice) {
            throw new NotFoundHttpException('Invoice not found');
        }

        $locale = $request->query->getString('locale', '');
        if (in_array($locale, ['en', 'es'], true)) {
            $request->setLocale($locale);
            if (method_exists($translator, 'setLocale')) {
                $translator->setLocale($locale);
            }
        }

        // Prepare Logo (with path traversal protection)
        $logoSrc = '';
        $logoPath = $projectDir.'/'.$companyLogoPath;
        $realLogoPath = realpath($logoPath);
        $realProjectDir = realpath($projectDir);
        // Ensure logo path is within project directory (defense-in-depth)
        if (false !== $realLogoPath && false !== $realProjectDir
            && str_starts_with($realLogoPath, $realProjectDir)
            && file_exists($realLogoPath)) {
            $logoContent = file_get_contents($realLogoPath);
            if (false !== $logoContent) {
                $logoData = base64_encode($logoContent);
                $logoSrc = 'data:image/png;base64,'.$logoData;
            }
        }

        $html = $this->renderView('invoice/pdf.html.twig', [
            'invoice' => $invoice,
            'logo_src' => $logoSrc,
            'format' => $format,
            'invoice_prefix' => $invoicePrefix,
            'company' => [
                'name' => $companyName,
                'tax_id' => $companyTaxId,
                'address_line1' => $companyAddressLine1,
                'address_line2' => $companyAddressLine2,
                'phone' => $companyPhone,
                'email' => $companyEmail,
                'web' => $companyWeb,
            ],
        ]);

        if ('html' === $format) {
            return new Response($html, 200, ['Content-Type' => 'text/html']);
        }

        // PDF Generation
        $pdfOptions = new Options();
        $pdfOptions->set('defaultFont', 'Arial');
        // Disable remote to prevent SSRF attacks - logo is embedded as base64
        $pdfOptions->set('isRemoteEnabled', false);

        $dompdf = new Dompdf($pdfOptions);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $formattedNumber = $invoicePrefix . $invoice->number;
        // Sanitize filename to prevent Content-Disposition header injection
        $safeFilename = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $formattedNumber) ?? $formattedNumber;
        $filename = sprintf('factura_%s.pdf', $safeFilename);
        $isDownload = $request->query->getBoolean('download', false);

        return new Response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => ($isDownload ? 'attachment' : 'inline').'; filename="'.$filename.'"',
        ]);
    }
}
