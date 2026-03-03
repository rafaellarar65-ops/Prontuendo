import { VariableResolverService } from './variable-resolver.service';

describe('VariableResolverService', () => {
  const service = new VariableResolverService({} as any);

  it('deve substituir placeholders no texto', () => {
    const result = service.replacePlaceholders('Olá {{paciente.nome}}', {
      paciente: { nome: 'Maria' },
    });

    expect(result).toBe('Olá Maria');
  });

  it('deve aplicar fallback quando valor não existe', () => {
    const result = service.replacePlaceholders('CPF: {{paciente.cpf}}', {
      paciente: {},
    }, '[N/D]');

    expect(result).toBe('CPF: [N/D]');
  });

  it('deve percorrer objects e substituir tokens em text', () => {
    const input = {
      objects: [
        { text: 'Paciente: {{paciente.nome}}' },
        {
          objects: [{ text: 'Médico: {{medico.nome}}' }],
        },
      ],
    };

    const output = service.resolveCanvasJson(
      input,
      {
        paciente: { nome: 'João' },
        medico: { nome: 'Dra. Ana' },
      },
      '',
    );

    expect(output.objects?.[0]?.text).toBe('Paciente: João');
    expect(output.objects?.[1]?.objects?.[0]?.text).toBe('Médico: Dra. Ana');
    expect(input.objects?.[0]?.text).toBe('Paciente: {{paciente.nome}}');
  });
});
