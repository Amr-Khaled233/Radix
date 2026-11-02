export type NavLink = {
  href: string;
  label: string;
};

export type NavCategory = NavLink & {
  index: number;
};
