//@ts-ignore
declare var JSON: {
  stringify(object: object): string;
  parse(string: string): object;
};

// Additional ambient globals for ExtendScript/CEP panel runtime
declare var BridgeTalk: any;
declare var ExternalObject: any;
declare var CSXSEvent: any;
declare var $: any;
declare var app: any;
