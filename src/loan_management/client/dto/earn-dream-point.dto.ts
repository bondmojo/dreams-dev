export class EarnDreamPointDto {
  client_id: string;
  amount: number;
  image: string;
  note: string;
  type: string; // should be transaction type from globals
}
