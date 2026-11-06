document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loanForm');
    const emailInput = document.getElementById('email');
    const emailGroup = document.getElementById('emailGroup');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const formStatus = document.getElementById('formStatus');

    // Fonction pour valider le format de l'email (Regex)
    function isValidEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    // Enlever l'erreur quand l'utilisateur tape
    emailInput.addEventListener('input', () => {
        emailGroup.classList.remove('error');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullname = document.getElementById('fullname').value.trim();
        const email = emailInput.value.trim();
        const phone = document.getElementById('phone').value.trim();
        const amount = document.getElementById('amount').value;

        // --- 1. VALIDATION CÔTÉ CLIENT ---
        let hasError = false;

        if (!fullname) {
            document.getElementById('fullname').parentElement.classList.add('error');
            hasError = true;
        }

        if (!isValidEmail(email)) {
            emailGroup.classList.add('error'); // Déclenche l'animation shake rouge
            hasError = true;
        }

        if (!phone) {
            document.getElementById('phone').parentElement.classList.add('error');
            hasError = true;
        }

        if (hasError) return; // Stoppe l'envoi si erreur de format

        // --- 2. PRÉPARATION DE L'ENVOI ---
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        formStatus.style.display = 'none';
        formStatus.className = 'form-status';

        try {
            // --- 3. ENVOI VERS L'API (défini dans api.js) ---
            
            // Étape A : On envoie l'email au client
            const clientResult = await sendLoanConfirmationToClient({
                email: email,
                fullname: fullname,
                amount: amount,
                phone: phone
            });

            // Si l'API nous dit que l'envoi a échoué (ex: adresse email inexistante)
            if (!clientResult.ok) {
                // On déclenche l'animation d'erreur sur le champ email
                emailGroup.classList.add('error');
                throw new Error("L'adresse email est invalide ou l'envoi a échoué.");
            }

            // Étape B : On envoie la notification à l'administrateur (vous)
            await sendLoanNotificationToAdmin({
                email: email,
                fullname: fullname,
                amount: amount,
                phone: phone
            });

            // --- 4. SI TOUT EST BON, ON AFFICHE LE SUCCÈS ---
            formStatus.classList.add('success');
            formStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> Dziękujemy! Twój wniosek został wysłany. Sprawdź swoją skrzynkę e-mail.`;
            form.reset();

        } catch (error) {
            // --- 5. EN CAS D'ERREUR D'ENVOI ---
            console.error("Erreur :", error.message);
            formStatus.classList.add('error');
            formStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Wystąpił błąd. Adres e-mail może być nieprawidłowy lub nasz serwer jest niedostępny.`;
            
            // On s'assure que l'animation est visible
            emailGroup.classList.add('error');
        } finally {
            // Remettre le bouton en état normal
            submitBtn.disabled = false;
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
        }
    });
});
