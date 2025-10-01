import { PrimaryGeneratedColumn } from 'typeorm';

export abstract class IdEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
}