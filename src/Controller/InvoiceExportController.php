<?php

declare(strict_types=1);

namespace App\Controller;

use App\Application\Query\Invoice\GetInvoiceExport\GetInvoiceExportQuery;
use Dompdf\Dompdf;
use Dompdf\Options;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Messenger\HandleTrait;

class InvoiceExportController extends AbstractController
{
    use HandleTrait;

    public function __construct(
        private MessageBusInterface $queryBus
    ) {
        $this->messageBus = $queryBus;
    }

    #[Route('/api/invoices/{id}/export/{format}', name: 'invoice_export', requirements: ['format' => 'pdf|html'], methods: ['GET'])]
    public function __invoke(
        int $id,
        string $format,
        Request $request,
        #[Autowire('%kernel.project_dir%')] string $projectDir,
        #[Autowire('%company_name%')] string $companyName,
        #[Autowire('%company_tax_id%')] string $companyTaxId,
        #[Autowire('%company_address_line1%')] string $companyAddressLine1,
        #[Autowire('%company_address_line2%')] string $companyAddressLine2,
        #[Autowire('%company_phone%')] string $companyPhone,
        #[Autowire('%company_email%')] string $companyEmail,
        #[Autowire('%company_web%')] string $companyWeb,
        #[Autowire('%company_logo_path%')] string $companyLogoPath
    ): Response
    {
        // CQRS: Query for the View DTO
        $invoice = $this->handle(new GetInvoiceExportQuery($id));

        if (!$invoice) {
            throw new NotFoundHttpException('Invoice not found');
        }

        // Prepare Logo
        $logoPath = $projectDir . '/' . $companyLogoPath;
        $logoSrc = '';
        if (file_exists($logoPath)) {
             $logoData = base64_encode(file_get_contents($logoPath));
             $logoSrc = 'data:image/png;base64,' . $logoData;
        }

        $html = $this->renderView('invoice/pdf.html.twig', [
            'invoice' => $invoice,
            'logo_src' => $logoSrc,
            'format' => $format,
            'company' => [
                'name' => $companyName,
                'tax_id' => $companyTaxId,
                'address_line1' => $companyAddressLine1,
                'address_line2' => $companyAddressLine2,
                'phone' => $companyPhone,
                'email' => $companyEmail,
                'web' => $companyWeb,
            ]
        ]);

        if ($format === 'html') {
            return new Response($html, 200, ['Content-Type' => 'text/html']);
        }

        // PDF Generation
        $pdfOptions = new Options();
        $pdfOptions->set('defaultFont', 'Arial');
        $pdfOptions->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($pdfOptions);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = sprintf('factura_%s.pdf', $invoice->number);
        $isDownload = $request->query->getBoolean('download', false);

        return new Response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => ($isDownload ? 'attachment' : 'inline') . '; filename="' . $filename . '"',
        ]);
    }
}
