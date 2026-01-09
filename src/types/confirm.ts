export namespace Confirm {
  export class Options {
    title!: string;
    message!: string;
    confirmText!: string;
    onConfirm!: () => Promise<void> | void;
  }

  export class State extends Options {
    isOpen = false;
    title = "";
    message = "";
    confirmText = "Confirm";
    onConfirm: () => Promise<void> | void = async () => {};
  }
}
