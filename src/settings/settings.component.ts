import { ipcRenderer } from 'electron';
import { domOperator } from "../utils/domOperator";

(function($) {
    $(() => {
        $('.app-minimize').on('click', () => ipcRenderer.invoke('minimize'));
        $('.app-close').on('click', () => ipcRenderer.invoke('close'));
        $('.app-choose-cli').on('click', async () => {
            const cli_path = await ipcRenderer.invoke('choose-cli');
            if (cli_path) {
                $('input[name=cli]').value(cli_path[0]);
            }
        });

        $('.input-type-toggle').on('click', function () {
            const inputEl = this.previousElementSibling.querySelector('input');
            if (inputEl.type === 'password') {
                inputEl.type = 'input';
                this.querySelector('i').classList.add('bi-eye-fill');
                this.querySelector('i').classList.remove('bi-eye-slash-fill');
            } else {
                inputEl.type = 'password';
                this.querySelector('i').classList.add('bi-eye-slash-fill');
                this.querySelector('i').classList.remove('bi-eye-fill');
            }
        });

        $<HTMLSelectElement>('select[name=algorithm]').on('change', function () {
            $('.col-pin').get().hidden = this.value === 'sha1';
        });

        $<HTMLFormElement>('.form').on('submit', function (e) {
            e.preventDefault();
            this.classList.add('app-validated');
            if (this.checkValidity()) {
                ipcRenderer.invoke('submit', $(this).serialize());
            }
        });

        new URLSearchParams(window.location.search).forEach((value, key) => {
            $('[name=' + key + ']').value(value);
            $('[type="checkbox"][name=' + key + ']').checked(true);
        });
    });
})(domOperator)
