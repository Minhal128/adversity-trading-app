export interface User {
  _id: string;
  name: string;
  email: string;
  skills?: string[];
  skills_offered?: string[];
  profileImage?: {
    url: string;
  };
  rating?: number;
}

export interface CompleteBarterData {
  barterId: string;
  rating: number;
  comment: string;
  review?: string;
}