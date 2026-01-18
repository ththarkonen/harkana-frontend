<template>
<section class = "space-y-6">
    <h2 class = "text-2xl md:text-3xl font-bold text-brand">Privacy policy</h2>

    <p>
        We respect your privacy and are committed to protecting your information.
        This policy explains what we collect and how we use it.
    </p>

    <!-- What we collect -->
    <div>
        <h3 class = "text-lg md:text-xl font-semibold mb-2">
            1. Information We Collect
        </h3>
        <p>
            When you create an account, we collect:
        </p>
        <ul class = "list-disc pl-5 mt-2 space-y-1">
            <li>Name</li>
            <li>Email address</li>
            <li>Password (securely hashed)</li>
        </ul>

        <p class="mt-4">Additionally:</p>
        <ul class="list-disc pl-5 mt-2 space-y-1">
        <li>Strictly necessary cookies (JWT for login)</li>
        </ul>

        <p class="mt-4">We do <strong>not</strong> collect usage analytics or unnecessary cookies.</p>
    </div>

    <!-- MFA -->
    <div>
        <h3 class="text-lg md:text-xl font-semibold mb-2">2. Two-Factor Authentication</h3>
        <p>
        For your security, <strong>multi-factor authentication (MFA) is highly recommended</strong>.
        We store necessary MFA-related security data (e.g., secret keys or verification seeds)
        in encrypted form. This information is used only to verify your login.
        </p>
    </div>

    <!-- How we use -->
    <div>
        <h3 class="text-lg md:text-xl font-semibold mb-2">3. How We Use Your Information</h3>
        <p>We use your information to:</p>
        <ul class="list-disc pl-5 mt-2 space-y-1">
        <li>create and manage your account</li>
        <li>store and process your datasets</li>
        <li>enable sharing and collaboration</li>
        <li>run analyses using compute tokens</li>
        <li>send important service-related messages</li>
        </ul>
        <p class="mt-4">We do <strong>not</strong> sell or share your data for advertising.</p>
    </div>

    <!-- Control -->
    <div>
        <h3 class="text-lg md:text-xl font-semibold mb-2">4. Your Data and Control</h3>
        <p>You can update your information or delete your datasets at any time.
        You may request account deletion. Shared or published datasets may remain visible
        to others depending on your previous actions.
        </p>
    </div>

    <!-- Payments -->
    <div>
        <h3 class="text-lg md:text-xl font-semibold mb-2">5. Payments</h3>
        <p>
        Payments are processed by <strong>Paddle</strong>. We do not store card information.
        </p>
    </div>

    <!-- Storage -->
    <div>
        <h3 class="text-lg md:text-xl font-semibold mb-2">6. Data Storage</h3>
        <p>
        Your data is stored on secure servers hosted by <strong>AWS</strong>, following
        European data protection standards.
        </p>
    </div>

    <!-- Sharing -->
    <div>
        <h3 class="text-lg md:text-xl font-semibold mb-2">7. When We Share Data</h3>
        <p>We only share your data with:</p>
        <ul class="list-disc pl-5 mt-2 space-y-1">
        <li>AWS (hosting and computation)</li>
        <li>Paddle (payments)</li>
        <li>Zenodo, if you choose to publish a DOI</li>
        </ul>
    </div>

    <!-- Security -->
    <div>
        <h3 class="text-lg md:text-xl font-semibold mb-2">8. Security</h3>
        <p>
        We use industry-standard security methods, including encrypted connections, hashed passwords,
        MFA, and restricted internal access.
        </p>
    </div>

    <!-- Children -->
    <div>
        <h3 class="text-lg md:text-xl font-semibold mb-2">9. Children</h3>
        <p>
        HARKANA is intended for scientific data processing. Users under 18 may use the platform,
        but local laws may require supervision.
        </p>
    </div>

    <!-- GDPR -->
    <div>
        <h3 class="text-lg md:text-xl font-semibold mb-2">10. Your Rights (GDPR)</h3>
        <p>
        As a Finland-based service, GDPR applies. You have rights to access, correct, delete,
        or export your data, and to restrict processing.
        </p>
    </div>

    <!-- Changes -->
    <div>
        <h3 class="text-lg md:text-xl font-semibold mb-2">11. Changes to This Policy</h3>
        <p>
        We may update this Privacy Policy occasionally. The date at the top will always show the latest version.
        </p>
    </div>

    <!-- Contact -->
    <div>
        <h3 class="text-lg md:text-xl font-semibold mb-2">12. Contact</h3>
        <p>
        If you have questions:
        <a href="mailto:contact@harkana.com" class="text-brand hover:underline">contact@harkana.com</a>
        </p>
    </div>
    
</section>
</template>