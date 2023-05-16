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

        new URLSearchParams(window.location.search).forEach((value, key) => $('input[name=' + key + ']').value(value));

        $<HTMLFormElement>('.form').on('submit', function (e) {
            e.preventDefault();
            this.classList.add('was-validated');
            if (this.checkValidity()) {

                ipcRenderer.invoke('submit', $(this).serialize());
            }
        })
    });
})(domOperator)
