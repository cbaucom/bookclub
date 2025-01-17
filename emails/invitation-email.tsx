import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { render } from '@react-email/render';

interface InvitationEmailProps {
  inviterName: string;
  groupName: string;
  inviteLink: string;
}

export function InvitationEmail({
  inviterName,
  groupName,
  inviteLink,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Join {groupName} on BookClub</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>BookClub Invitation</Heading>
          <Text style={text}>
            {inviterName} has invited you to join their book club group:{' '}
            <strong>{groupName}</strong>
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={inviteLink}>
              Join Group
            </Button>
          </Section>
          <Text style={text}>
            or copy and paste this URL into your browser:{' '}
            <Link href={inviteLink} style={link}>
              {inviteLink}
            </Link>
          </Text>
          <Text style={footer}>
            If you weren&apos;t expecting this invitation, you can ignore this
            email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function renderInvitationEmail(props: InvitationEmailProps) {
  return render(<InvitationEmail {...props} />);
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const h1 = {
  color: '#1a202c',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 24px',
};

const text = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px',
};

const buttonContainer = {
  margin: '24px 0',
};

const button = {
  backgroundColor: '#3182ce',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};

const link = {
  color: '#3182ce',
  textDecoration: 'underline',
};

const footer = {
  color: '#718096',
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '32px 0 0',
};
