
export interface View<T> {
    id: string;
    template: string;

    display(model:T, container: HTMLElement):null
}