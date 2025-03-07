export class User {
  id: number | undefined;
  name: string | undefined;
  email!: string;
  createdAt!: Date;
  isActive?: boolean;
}

export class Devang {
id:1 | undefined;
name:"Devang" | undefined;
email:"devang@gmail.com" | undefined;
createdAt:"2023-08-01T00:00:00.000Z" | undefined
}

export class Post {
  id: number | undefined;
  title: string | undefined;
  content: string | undefined;
  authorId!: number;
}
