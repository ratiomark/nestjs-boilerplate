import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { OrNeverType } from '../../utils/types/or-never.type';
import { AllConfigType } from 'src/config/config.type';
import { JwtPayloadType } from './types/jwt-payload.type';
import { jwtStrategyName } from './strategy-names';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, jwtStrategyName) {
  constructor(private configService: ConfigService<AllConfigType>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('auth.secret', { infer: true }),
      ignoreExpiration: true,
    });
  }

  public validate(payload: JwtPayloadType): OrNeverType<JwtPayloadType> {
    console.log('*** Inside JwtStrategy validate method ***');
    console.log('Payload:', payload);

    if (!payload.id) {
      console.log('No ID in payload, throwing UnauthorizedException.');
      throw new UnauthorizedException();
    }
    // console.log(payload.exp);
    // console.log(new Date().getTime());
    // console.log(new Date(payload.exp));
    // console.log(payload.exp < new Date().getTime());

    if (payload.exp - payload.iat < 0) {
      throw new UnauthorizedException('expired');
    }

    console.log('Validation successful, returning payload.');
    return payload;
  }
}
