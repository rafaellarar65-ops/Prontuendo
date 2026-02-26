async loginPatient(tenantId: string, dto: LoginDto) {
  const user = await this.prisma.user.findFirst({
    where: { tenantId, email: dto.email.toLowerCase(), isActive: true, role: 'PATIENT' },
  });

  if (!user) {
    throw new UnauthorizedException('Credenciais inválidas');
  }

  const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
  if (!passwordMatch) {
    throw new UnauthorizedException('Credenciais inválidas');
  }

  return this.issueTokens(user);
}
