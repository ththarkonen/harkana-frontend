<template>
<section class = "space-y-6">

    <h2 class = "text-2xl md:text-3xl font-bold text-brand">
        Terms of Service
    </h2>

    <p>
        Welcome to <strong class = "text-brand">HARKANA</strong>.
        By using our platform, you agree to these Terms of Service.
        Please read them carefully.
    </p>

    <!-- What the service does -->
    <div>
        <h3 class = "text-lg md:text-xl font-semibold mb-2">
            1. What HARKANA does
        </h3>
        <p>
            HARKANA is a platform for analyzing, correcting, storing, visualizing,
            and sharing spectroscopic datasets. You can upload datasets, run automated
            processing, collaborate with others, and publish results to Zenodo to obtain a DOI.
        </p>
    </div>

    <!-- Accounts -->
    <div>
        <h3 class = "text-lg md:text-xl font-semibold mb-2">
            2. Accounts and Security
        </h3>
        <p>
            To use HARKANA, you must create an account using your name, email, and password.
            For your security, <strong>multi-factor authentication (MFA) is highly recommended for all users</strong>.
            You are responsible for keeping your login information safe and notifying us if
            you suspect unauthorized access.
        </p>
    </div>

    <!-- Data ownership -->
    <div>
        <h3 class = "text-lg md:text-xl font-semibold mb-2">
            3. Your Content
        </h3>
        <p>
            You always own your datasets, results, and all content you upload or create.
            We only process your data so the service can function.
            Your datasets are never used for any other purpose unless an explicit agreement is made.
            You may delete your data at any time.
        </p>
    </div>

    <!-- Tokens + refunds -->
    <div>
        <h3 class = "text-lg md:text-xl font-semibold mb-2">
            4. Compute Tokens and Refunds
        </h3>
        <p>
            HARKANA uses compute tokens for running analyses and storing projects.
            Tokens are purchased through Paddle, and we do not store payment information.
        </p>
        <ul class = "list-disc pl-5 mt-2 space-y-1">
            <li>Unused tokens can be refunded for <strong>90%</strong> of the purchase price.</li>
            <li>A refund request must be made within <strong>14 days</strong>.</li>
            <li>Used tokens cannot be refunded.</li>
        </ul>
    </div>

    <!-- Sharing -->
    <div>
        <h3 class = "text-lg md:text-xl font-semibold mb-2">
            5. Sharing and Collaboration
        </h3>
        <p>
            You may share datasets and results with other HARKANA users.
            Your name may appear in shared projects so collaborators can identify you.
        </p>
    </div>

    <!-- Zenodo -->
    <div>
        <h3 class = "text-lg md:text-xl font-semibold mb-2">
            6. Publishing to Zenodo
        </h3>
        <p>
            Publishing to Zenodo is optional. When you publish, your data is subject to Zenodo's own terms and policies.
            You are responsible for having the rights to publish the data.
        </p>
    </div>

    <!-- Acceptable use -->
    <div>
        <h3 class = "text-lg md:text-xl font-semibold mb-2">
            7. Acceptable Use
        </h3>
        <p>
            You agree not to misuse the platform. This includes:
        </p>
        <ul class = "list-disc pl-5 mt-2 space-y-1">
            <li>attempting to access another user's account</li>
            <li>uploading harmful files or code</li>
            <li>using the service for illegal purposes</li>
            <li>attacking or disrupting HARKANA systems</li>
        </ul>
    </div>

    <!-- Third-party services -->
    <div>
        <h3 class = "text-lg md:text-xl font-semibold mb-2">
            8. Third-Party Services
        </h3>
        <p>
            HARKANA uses the following third-party services:
        </p>
        <ul class = "list-disc pl-5 mt-2 space-y-1">
            <li><strong>AWS</strong> for hosting and computation</li>
            <li><strong>Paddle</strong> for payment processing</li>
            <li><strong>Zenodo</strong> for DOI publishing (optional)</li>
        </ul>
    </div>

    <!-- Liability -->
    <div>
        <h3 class = "text-lg md:text-xl font-semibold mb-2">
            9. Limitation of Liability
        </h3>
        <p>
            HARKANA is provided "as is." We are not responsible for data loss, downtime,
            or issues caused by corrupted input datasets. To the extent allowed by law,
            our total liability is limited to the amount you paid in the last 12 months.
        </p>
    </div>

    <!-- Changes -->
    <div>
        <h3 class = "text-lg md:text-xl font-semibold mb-2">
            10. Changes to These Terms
        </h3>
        <p>
            We may update these Terms from time to time. If changes are significant, we will notify you.
        </p>
    </div>

    <!-- Contact -->
    <div>
        <h3 class = "text-lg md:text-xl font-semibold mb-2">
            11. Contact
        </h3>
        <p>
            If you have any questions: 
            <a href = "mailto:contact@harkana.com" class = "text-brand hover:underline">
                contact@harkana.com
            </a>
        </p>
    </div>
    
</section>
</template>