import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Token, User } from 'src/database/entities';
import { Repository } from 'typeorm';
import { CreateUserDto, LoginUserDto } from '../Dtos';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Token) private tokenRepo: Repository<Token>,
    private jwtService: JwtService,
  ) {}

  async signUpUser(data: CreateUserDto) {
    const { email, phone } = data;
    const isEmailExist = await this.userRepo.findOneBy({ email });
    if (isEmailExist) throw new BadRequestException('Email is already Exist');
    const isPhoneExist = await this.userRepo.findOneBy({ phone });
    if (isPhoneExist) throw new BadRequestException('Phone is already Exist');
    const user = this.userRepo.create(data);
    await this.userRepo.save(user);
    return this.generateAuthToken(user);
  }

  async loginUser(data: LoginUserDto) {
    const { email, password } = data;
    const user = await this.userRepo.findOneBy({ email, password });
    if (!user)
      throw new BadRequestException(
        'username and password combination does not match',
      );
    return this.generateAuthToken(user);
  }

  async generateAuthToken(user: User) {
    const jwtToken = await this.jwtService.signAsync({ userId: user.userId });
    const token = this.tokenRepo.create({
      token: jwtToken,
      userId: user,
    });
    await this.tokenRepo.save(token);
    return { user, token: token.token };
  }
}
