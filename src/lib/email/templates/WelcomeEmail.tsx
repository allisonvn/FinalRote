import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from '@react-email/components';
import React from 'react';

interface WelcomeEmailProps {
    name?: string;
    appName?: string;
    dashboardUrl?: string;
}

export const WelcomeEmail = ({
    name = 'Usuário',
    appName = 'Rota Final',
    dashboardUrl = 'https://rotafinal.com/dashboard',
}: WelcomeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Bem-vindo ao {appName}!</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Heading className="text-zinc-800 text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Bem-vindo ao {appName}!
                        </Heading>
                        <Text className="text-zinc-600 text-[14px] leading-[24px]">
                            Olá {name},
                        </Text>
                        <Text className="text-zinc-600 text-[14px] leading-[24px]">
                            Estamos muito felizes em ter você a bordo. Sua conta foi criada com sucesso e você já pode começar a otimizar suas conversões.
                        </Text>
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Link
                                className="bg-indigo-600 rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                href={dashboardUrl}
                            >
                                Acessar Dashboard
                            </Link>
                        </Section>
                        <Text className="text-zinc-500 text-[14px] leading-[24px]">
                            Se tiver alguma dúvida, nossa equipe de suporte está pronta para ajudar.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default WelcomeEmail;
