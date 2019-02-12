export function UploadFiles(): Promise<FileList> {
    return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.click();
        input.onchange = (e) => {
            resolve(input.files!);
        };
    });
}
