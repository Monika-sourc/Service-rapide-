// ============================================================
// LOGIQUE DU FORMULAIRE - SITE FINANCEEXPRESS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Récupération des éléments du DOM
    const form = document.getElementById('loanForm');
    const emailInput = document.getElementById('email');
    const emailGroup = document.getElementById('emailGroup');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const formStatus = document.getElementById('formStatus');

    // Fonction de validation du format de l'email (Regex)
    function isValidEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    // Fonction utilitaire pour retirer les erreurs visuelles
    function clearErrors() {
        document.querySelectorAll('.input-group.error').forEach(el => {
            el.classList.remove('error');
        });
        formStatus.style.display = 'none';
        formStatus.className = 'form-status';
    }

    // Retirer l'erreur sur l'email dès que l'utilisateur commence à taper
    emailInput.addEventListener('input', () => {
        emailGroup.classList.remove('error');
    });

    // Gestion de la soumission du formulaire
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        // 1. Récupération des valeurs
        const fullname = document.getElementById('fullname').value.trim();
        const email = emailInput.value.trim();
        const phone = document.getElementById('phone').value.trim();
        const amount = document.getElementById('amount').value;

        // 2. Validation côté client
        let hasError = false;

        if (!fullname) {
            document.getElementById('fullname').parentElement.classList.add('error');
            hasError = true;
        }

        if (!isValidEmail(email)) {
            emailGroup.classList.add('error'); // Déclenche l'animation shake
            hasError = true;
        }

        if (!phone) {
            document.getElementById('phone').parentElement.classList.add('error');
            hasError = true;
        }

        if (!amount) {
            document.getElementById('amount').parentElement.classList.add('error');
            hasError = true;
        }

        // Si erreur de format, on arrête là
        if (hasError) return;

        // 3. Préparation de l'interface (Mode chargement)
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';

        try {
            // ====================================================
            // 4. ENVOI VERS L'API (Fonctions définies dans api.js)
            // ====================================================
            
            // Étape A : Envoi de l'email de confirmation au client
            const clientResult = await sendLoanConfirmationToClient({
                email: email,
                fullname: fullname,
                amount: amount,
                phone: phone
            });

            // Si l'API nous renvoie une erreur (ex: email inexistant)
            if (!clientResult.ok) {
                // On déclenche l'animation d'erreur sur le champ email
                emailGroup.classList.add('error');
                throw new Error("L'adresse email est invalide ou l'envoi a échoué.");
            }

            // Étape B : Envoi de la notification à l'administrateur (noreplyinfo.pl@gmail.com)
            await sendLoanNotificationToAdmin({
                email: email,
                fullname: fullname,
                amount: amount,
                phone: phone
            });

            // ====================================================
            // 5. SUCCÈS
            // ====================================================
            formStatus.classList.add('success');
            formStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> Dziękujemy! Twój wniosek został wysłany. Sprawdź swoją skrzynkę e-mail.`;
            
            // Réinitialiser le formulaire
            form.reset();

        } catch (error) {
            // ====================================================
            // 6. ÉCHEC (Email invalide ou API down)
            // ====================================================
            console.error("Erreur d'envoi :", error.message);
            
            formStatus.classList.add('error');
            formStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Wystąpił błąd. Adres e-mail może być nieprawidłowy lub nasz serwer jest chwilowo niedostępny.`;
            
            // On s'assure que l'animation rouge est bien visible
            emailGroup.classList.add('error');

        } finally {
            // ====================================================
            // 7. Remise en état du bouton
            // ====================================================
            submitBtn.disabled = false;
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
        }
    });
});
