export type TItemCategory = 'VEGETABLE' | 'FRUIT' | 'DAIRY' | 'OTHERS';
export type TUserRole = 'ADMIN' | 'USER';

export interface IItem {
  id: number;
  name: string;
  price: number;
  category: TItemCategory,
  count: number;
  is_deleted: boolean;
}

export interface IUser {
  id: number;
  role: TUserRole;
  email: string;
  last_login: string;
}