import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Color } from './entities/color.entity';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

@Injectable()
export class ColorsService {
  constructor(
    @InjectRepository(Color)
    private readonly colorRepo: Repository<Color>,
  ) {}

  async create(dto: CreateColorDto): Promise<Color> {
    const exists = await this.colorRepo.findOne({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Color already exists');
    const entity = this.colorRepo.create(dto);
    return await this.colorRepo.save(entity);
  }

  async findAll(): Promise<Color[]> {
    return await this.colorRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Color> {
    const color = await this.colorRepo.findOne({ where: { id } });
    if (!color) throw new NotFoundException('Color not found');
    return color;
  }

  async update(id: string, dto: UpdateColorDto): Promise<Color> {
    const color = await this.findOne(id);

    // Check duplicate name if provided
    if (dto.name) {
      const exists = await this.colorRepo.findOne({ where: { name: dto.name } });
      if (exists && exists.id !== id) {
        throw new ConflictException('Color already exists');
      }
    }

    if (dto.name !== undefined) color.name = dto.name;
    if (dto.hexCode !== undefined) (color as any).hexCode = dto.hexCode;

    try {
      return await this.colorRepo.save(color);
    } catch (err) {
      throw new BadRequestException('Unable to update color');
    }
  }

  async remove(id: string): Promise<void> {
    const color = await this.findOne(id);
    await this.colorRepo.remove(color);
  }
}


