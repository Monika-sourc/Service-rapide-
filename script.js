// ============================================================
// LOGIQUE DU FORMULAIRE - SITE FINANCEEXPRESS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loanForm');
    const emailInput = document.getElementById('email');
    const emailGroup = document.getElementById('emailGroup');
    const amountInput = document.getElementById('amount');
    const amountGroup = document.getElementById('amountGroup');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const formStatus = document.getElementById('formStatus');

    // --- ANIMATIONS AU SCROLL ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.testimonial-card, .step-card').forEach(el => observer.observe(el));

    // --- VALIDATION EMAIL ---
    function isValidEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    emailInput.addEventListener('input', () => emailGroup.classList.remove('error'));
    amountInput.addEventListener('input', () => amountGroup.classList.remove('error'));

    // --- SOUMISSION ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullname = document.getElementById('fullname').value.trim();
        const email = emailInput.value.trim();
        const phone = document.getElementById('phone').value.trim();
        const amount = parseFloat(amountInput.value);
        const duration = document.getElementById('duration').value;
        const purpose = document.getElementById('purpose').value;

        let hasError = false;

        if (!fullname) { document.getElementById('fullname').parentElement.classList.add('error'); hasError = true; }
        if (!isValidEmail(email)) { emailGroup.classList.add('error'); hasError = true; }
        if (!phone) { document.getElementById('phone').parentElement.classList.add('error'); hasError = true; }
        if (!amount || amount < 3000) { amountGroup.classList.add('error'); hasError = true; }
        if (!duration) { document.getElementById('duration').parentElement.classList.add('error'); hasError = true; }
        if (!purpose) { document.getElementById('purpose').parentElement.classList.add('error'); hasError = true; }

        if (hasError) return;

        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        formStatus.style.display = 'none';
        formStatus.className = 'form-status';

        try {
            const clientResult = await sendLoanConfirmationToClient({
                email, fullname, amount: amount.toLocaleString('pl-PL'), phone, duration, purpose
            });

            if (!clientResult.ok) {
                emailGroup.classList.add('error');
                throw new Error("L'adresse email est invalide ou l'envoi a échoué.");
            }

            await sendLoanNotificationToAdmin({
                email, fullname, amount: amount.toLocaleString('pl-PL'), phone, duration, purpose
            });

            formStatus.classList.add('success');
            formStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> Dziękujemy! Twój wniosek został wysłany. Decyzję otrzymasz w ciągu 15 minut (maks. 24 godzin). Sprawdź swoją skrzynkę e-mail.`;
            form.reset();

        } catch (error) {
            console.error("Erreur d'envoi :", error.message);
            formStatus.classList.add('error');
            formStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Wystąpił błąd. Adres e-mail może być nieprawidłowy lub nasz serwer jest chwilowo niedostępny.`;
            emailGroup.classList.add('error');
        } finally {
            submitBtn.disabled = false;
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
        }
    });
});
