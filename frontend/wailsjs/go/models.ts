export namespace models {
  export class Item {
    id: number;
    name: string;
    quantity: number;
    comment: string;
    updated: any;

    static createFrom(source: any = {}) {
      return new Item(source);
    }

    constructor(source: any = {}) {
      if ("string" === typeof source) source = JSON.parse(source);
      this.id = source["id"];
      this.name = source["name"];
      this.quantity = source["quantity"];
      this.comment = source["comment"];
      this.updated = this.convertValues(source["updated"], null);
    }

    convertValues(a: any, classs: any, asMap: boolean = false): any {
      if (!a) {
        return a;
      }
      if (a.slice && a.map) {
        return (a as any[]).map((elem) => this.convertValues(elem, classs));
      } else if ("object" === typeof a) {
        if (asMap) {
          for (const key of Object.keys(a)) {
            a[key] = new classs(a[key]);
          }
          return a;
        }
        return new classs(a);
      }
      return a;
    }
  }
}
