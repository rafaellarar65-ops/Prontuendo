const onSubmit = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setMessage('');

  mutate(
    { email, password },
    {
      onSuccess: () => {
        void navigate('/paciente');
      },
    },
  );
};
