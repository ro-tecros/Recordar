export type RootStackParamList = {
  Tabs: undefined;
  ExitChecklist: { outingIds: string[] };
  OutingDetail: { id: string };
  ItemForm: {
    mode: 'essential' | 'outingItem';
    /** Id del elemento a editar (si se está editando). */
    id?: string;
    /** Salida a la que pertenece el nuevo item (si mode === 'outingItem' y es nuevo). */
    outingId?: string;
  };
};

export type TabParamList = {
  Salir: undefined;
  Siempre: undefined;
  Salidas: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
