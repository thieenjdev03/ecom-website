import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { PolicyDto, PolicyListItemDto } from './dto/policy-response.dto';

@ApiTags('policies')
@Controller('policies')
export class PoliciesPublicController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  @ApiOperation({ summary: 'List active policies (sidebar), ordered by display_order' })
  @ApiOkResponse({ type: [PolicyListItemDto] })
  async findAll(): Promise<PolicyListItemDto[]> {
    const policies = await this.policiesService.findActive();
    return policies.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      display_order: p.display_order,
      is_active: p.is_active,
    }));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get an active policy by slug (with HTML content)' })
  @ApiParam({ name: 'slug' })
  @ApiOkResponse({ type: PolicyDto })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.policiesService.findBySlug(slug);
  }
}
